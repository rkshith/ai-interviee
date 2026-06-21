import { Navigate } from "react-router";
import React, { useContext, useEffect } from 'react'
import { AuthContext } from "../auth.context";
import { getMe } from "../services/auth.api";

const Protected = ({children}) => {
    const { loading, user, setUser, setLoading } = useContext(AuthContext)

    useEffect(() => {
        const fetchSessionUser = async () => {
            if (user) {
                setLoading(false)
                return
            }

            setLoading(true)

            try {
                const data = await getMe()
                setUser(data.user)
            } catch (err) {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        fetchSessionUser()
    }, [user, setLoading, setUser])


    if(loading){
        return (<main><h1>Loading...</h1></main>)
    }

    if(!user){
        return <Navigate to={'/login'} />
    }
    
    return children
}

export default Protected