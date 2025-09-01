"use client"

import { useContext } from "react"
import { UserContext } from "./UserProvider"

export function useUser() {
    const { user } = useContext(UserContext)


    return user;
}
