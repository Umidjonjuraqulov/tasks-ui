import axios from "axios"

export const api = axios.create({
  baseURL: "/api",
})
export const getTasks = async (params?: any) => {
  const res = await api.get("/tasks", { params })
  return res.data
}
export const getGroups = async () => {
  const res = await api.get("/groups")
  return res.data
}

export const getUsers = async () => {
  const res = await api.get("/users")
  return res.data
}

export const getStages = async () => {
  const res = await api.get("/stages")
  return res.data
}
