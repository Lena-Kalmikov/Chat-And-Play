import "./login.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socketIoService";

function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const registerUser = async (event) => {
        event.preventDefault()

        if (username !== "" && password !== "") {
            const usersData = {
                username: username,
                password: password,
            };
            socket.emit("register_user", usersData);
        } else {
            if (username === "" && password === "")
                alert("Please provide both Username and Password");
            else if (username === "")
                alert("Please provide a Username");
            else
                alert("Please provide a Password");
        }
    };

    useEffect(() => {
        socket.on("on_register_response", (data) => {
            if (data.error) {
                alert(data.error)
            } else {
                navigate("/TalkBack", { state: { "username": data.username } });
            }
        });
    }, [socket]);

    return (
        <div >
            <h1>New user?</h1>
            <form className="loginContainer" onSubmit={registerUser}>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="Name"
                />
                <br />
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="text"
                    placeholder="Password"
                />
                <br />
                <button type="submit" value="Register">Register</button>
                <p>Already an exisiting member? <a href="/">Login</a></p>
            </form>
        </div>
    )
}
export default Register