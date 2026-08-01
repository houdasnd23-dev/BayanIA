import { clearToken, request, setToken } from "../api";

export interface LoginResponse {
  access_token: string;
  token_type?: string;
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        mot_de_passe: credentials.password,
      }),
    });

    await setToken(data.access_token);
    return data;
  },

  register: async (userData: {
    nom_user: string;
    email: string;
    mot_de_passe: string;
  }) => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    await clearToken();
  },
};