import { request } from "../api";

export interface UserProfile {
  id_user?: number;
  nom_user: string;
  email: string;
  profil?: {
    type_profil?: string;
  };
}

export const usersApi = {
  getMe: (): Promise<UserProfile> => request("/users/me"),

  updateMe: (data: { nom_user: string; email: string }): Promise<UserProfile> =>
    request("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};