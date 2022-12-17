import "./index.css";
import React from "react";
//import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import Login from "./components/login";
import Register from "./components/register";
import { render } from "react-dom";

//const root = ReactDOM.createRoot(document.getElementById("root"));

render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="Register" element={<Register />} />
            <Route path="TalkBack" element={<App />}></Route>
        </Routes>
    </BrowserRouter>,
    document.getElementById("root")
    
);