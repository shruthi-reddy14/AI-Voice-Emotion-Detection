import { useState } from "react";
import axios from "axios";

function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {

        try {

            const response = await axios.post(
                "http://127.0.0.1:5000/api/login",
                {
                    username: username,
                    password: password
                }
            );

            if (response.data.success) {

                alert("Login Successful");

            } else {

                alert(response.data.message);
            }

        } catch (error) {

            alert("Error connecting to Flask");

            console.log(error);
        }
    };

    return (

        <div style={{ padding: "40px" }}>

            <h1>Login</h1>

            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <br /><br />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <br /><br />

            <button onClick={handleLogin}>
                Login
            </button>

        </div>
    );
}

export default Login;