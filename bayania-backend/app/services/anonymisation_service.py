import re
from typing import Dict, List, Tuple
from app.models.donnee_sensible import DonneeSensible
class AnonymisationService:
    # Regex patterns
    EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
    
    # Matches typical phone formats (+212 612345678, 0612345678, +33 6 12 34 56 78, etc.)
    PHONE_REGEX = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d{2,4})?')
    
    # Matches typical Moroccan CIN (e.g., AB123456, C123456) or general alphanumeric ID
    CIN_REGEX = re.compile(r'\b[A-Z]{1,2}\d{5,6}\b')
    
    # Matches common address introductions or patterns (Rue, Avenue, Boulevard...)
    ADDRESS_REGEX = re.compile(
        r'\b\d{1,4}\s+(?:rue|av|ave|avenue|bd|boulevard|impasse|route|quartier|residence|résidence|villa|appartement)\s+[^,.\n]+',
        re.IGNORECASE
    )
    
    # Matches names introduced by common phrases (Je m'appelle X, Mon nom est X, Mr X, Mme X)
    NAME_INTRO_REGEX = re.compile(
        r'\b(?:je m\'appelle|mon nom est|de la part de|mr\.|mme\.|dr\.|me\.)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b',
        re.IGNORECASE
    )
    @classmethod
    def anonymise(cls, text: str) -> Tuple[str, List[Dict[str, str]]]:
        """
        Anonymizes sensitive data in the text and returns the anonymized text
        along with the list of detected sensitive data metadata.
        """
        anonymised_text = text
        mappings: List[Dict[str, str]] = []
        
        # 1. Emails
        emails = list(set(cls.EMAIL_REGEX.findall(anonymised_text)))
        for idx, email in enumerate(emails):
            placeholder = f"[EMAIL_{idx + 1}]"
            anonymised_text = anonymised_text.replace(email, placeholder)
            mappings.append({
                "type_donnee": "EMAIL",
                "valeur_detectee": email,
                "valeur_anonymisee": placeholder
            })
            
        # 2. CIN
        cins = list(set(cls.CIN_REGEX.findall(anonymised_text)))
        for idx, cin in enumerate(cins):
            placeholder = f"[CIN_{idx + 1}]"
            anonymised_text = anonymised_text.replace(cin, placeholder)
            mappings.append({
                "type_donnee": "CIN",
                "valeur_detectee": cin,
                "valeur_anonymisee": placeholder
            })
            
        # 3. Addresses
        addresses = list(set(cls.ADDRESS_REGEX.findall(anonymised_text)))
        for idx, address in enumerate(addresses):
            # Guard against replacing a sub-string that was already replaced
            if address in anonymised_text:
                placeholder = f"[ADRESSE_{idx + 1}]"
                anonymised_text = anonymised_text.replace(address, placeholder)
                mappings.append({
                    "type_donnee": "ADRESSE",
                    "valeur_detectee": address,
                                        "valeur_detectee": phone_clean,
                    "valeur_anonymisee": placeholder
                })
                phone_idx += 1
        # 5. Names via introductory phrases
        names = list(set(cls.NAME_INTRO_REGEX.findall(anonymised_text)))
        name_idx = 1
        for name in names:
            name_clean = name.strip()
            if name_clean in anonymised_text and not any(placeholder in name_clean for placeholder in ["[EMAIL", "[CIN", "[TELEPHONE", "[ADRESSE"]):
                placeholder = f"[NOM_{name_idx}]"
                anonymised_text = anonymised_text.replace(name_clean, placeholder)
                mappings.append({
                    "type_donnee": "NOM",
                    "valeur_detectee": name_clean,
                    "valeur_anonymisee": placeholder
                })
                name_idx += 1
                
        return anonymised_text, mappings
    @classmethod
    def deanonymise(cls, text: str, mappings: List[DonneeSensible]) -> str:
        """
        Restores the original text using the mappings stored in the DB.
        """
        original_text = text
        # Sort mappings by length of value_anonymisee descending to avoid replacing sub-strings incorrectly (e.g. [NOM_10] vs [NOM_1])
        sorted_mappings = sorted(mappings, key=lambda x: len(x.valeur_anonymisee), reverse=True)
        for mapping in sorted_mappings:
            original_text = original_text.replace(mapping.valeur_anonymisee, mapping.valeur_detectee)
        return original_text
