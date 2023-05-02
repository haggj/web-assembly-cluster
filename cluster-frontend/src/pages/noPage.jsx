import React from 'react';
import {Link} from "react-router-dom";

export const NoPage = () => {
    return (
        <>
            <h1>Not a Page</h1>
            <nav>
                <ul>
                    <li>
                        <Link to="/master-dashboard">Master</Link>
                    </li>
                    <li>
                        <Link to="/client">Client</Link>
                    </li>
                </ul>
            </nav>
        </>
    );
};
