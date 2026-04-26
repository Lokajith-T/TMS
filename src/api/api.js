const BASE_URL = "/api";

export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return response;
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const response = await fetch(`${BASE_URL}/user/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

export const fetchCanvasState = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/canvas/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

export const saveCanvasState = async (graphData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/canvas/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ graph_data: graphData }),
  });
  return response;
};
