import pytest
from app.services.anonymisation_service import AnonymisationService
from app.models.donnee_sensible import DonneeSensible
def test_anonymise_email_and_phone():
    text = "Bonjour, mon email est test@example.com et mon numéro est 0612345678."
    anonymised, mappings = AnonymisationService.anonymise(text)
    
    assert "[EMAIL_1]" in anonymised
    assert "[TELEPHONE_1]" in anonymised
    assert "test@example.com" not in anonymised
    assert "0612345678" not in anonymised
    
    assert len(mappings) == 2
    types = [m["type_donnee"] for m in mappings]
    assert "EMAIL" in types
    assert "TELEPHONE" in types
def test_anonymise_cin_and_address():
    text = "Mon CIN est AB123456. J'habite au 12 Rue de Paris."
    anonymised, mappings = AnonymisationService.anonymise(text)
    
    assert "[CIN_1]" in anonymised
    assert "[ADRESSE_1]" in anonymised
    assert "AB123456" not in anonymised
    assert "12 Rue de Paris" not in anonymised
    
    assert len(mappings) == 2
    types = [m["type_donnee"] for m in mappings]
    assert "CIN" in types
    assert "ADRESSE" in types
def test_anonymise_name():
    text = "Je m'appelle Jean Dupont. De la part de Mme Marie Curie."
    anonymised, mappings = AnonymisationService.anonymise(text)
    
    assert "[NOM_1]" in anonymised
    assert "[NOM_2]" in anonymised
    assert "Jean Dupont" not in anonymised
    assert "Marie Curie" not in anonymised
def test_deanonymise():
    text = "Bonjour, mon nom est [NOM_1], email [EMAIL_1]."
    # Simulate DB model mappings
    mappings = [
        DonneeSensible(type_donnee="NOM", valeur_detectee="Jean", valeur_anonymisee="[NOM_1]", id_question=1),
        DonneeSensible(type_donnee="EMAIL", valeur_detectee="jean@test.com", valeur_anonymisee="[EMAIL_1]", id_question=1),
    ]
    
    restored = AnonymisationService.deanonymise(text, mappings)
    assert restored == "Bonjour, mon nom est Jean, email jean@test.com."