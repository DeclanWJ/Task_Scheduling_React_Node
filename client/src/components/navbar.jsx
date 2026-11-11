import React from 'react'
import './navbar.css'

const Navbar = () => {

    return (
        <nav className="navbar">
            <div className="navbar-logo">MySite</div>
            <ul className="navbar-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#createTask">Create Task</a></li>
                <li><a href="#tasks">Tasks</a></li>
            </ul>
        </nav>

    );

};

export default Navbar;