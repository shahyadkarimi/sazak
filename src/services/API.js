import axios from "axios";

const host =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://sazaklab.ir";

export const baseURL = `${host}/api`;
export const siteURL = host;

// axios config
const servicesApi = axios.create({
  baseURL: baseURL,
  withCredentials: false,
  timeout: 60000000,
  headers: {
    "Content-Type": "application/json",
  },
});

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const localToken =
      localStorage.getItem("impersonation_token") ||
      localStorage.getItem("token");

  return localToken;
};

// post method
const postData = async (
  param,
  data,
  onUploadProgress,
  headers,
  withToken = true
) => {
  if (withToken) {
    let token = getStoredToken();
    const res = await servicesApi.post(param, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(headers === "multipart" && {
          "Content-Type": "multipart/form-data",
        }),
      },
      onUploadProgress,
    });

    return res;
  }

  const res = await servicesApi.post(param, data);
  return res;
};

// get method
const getData = async (param, data, headers, withToken = true) => {
  if (withToken) {
    const token = getStoredToken();

    const res = await servicesApi.get(param, {
      params: data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res;
  }

  const res = await servicesApi.get(param, { params: data });
  return res;
};

// patch method
const patchData = async (param, data, withToken = true) => {
  if (withToken) {
    const token = getStoredToken();

    const res = await servicesApi.patch(param, data, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res;
  }

  const res = await servicesApi.patch(param, data);
  return res;
};

// patch method
const putData = async (param, data, withToken = true) => {
  if (withToken) {
    const token = getStoredToken();

    const res = await servicesApi.put(param, data, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res;
  }

  const res = await servicesApi.put(param, data);
  return res;
};

// delete method
const deleteData = async (param, data, withToken = true) => {
  if (withToken) {
    const token = getStoredToken();

    const res = await servicesApi.delete(param, {
      headers: { Authorization: `Bearer ${token}` },
      data: data,
    });

    return res;
  }

  const res = await servicesApi.delete(param, data);
  return res;
};

export { postData, getData, patchData, deleteData, putData };
