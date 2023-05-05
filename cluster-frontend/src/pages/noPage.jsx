import React from 'react';
import {Link} from "react-router-dom";
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';


export const NoPage = () => {
    return (
        <div style={{margin: '30px'}}>
            <Card>
                <Card.Body >
                    <Card.Title> <h2> Welcome to the WebAssembly HPC 🚀 </h2></Card.Title>
                    <Card.Subtitle>You can either connect your device to the cluster or you can visit the master dashboard.</Card.Subtitle>
                    <div style={{marginTop: '30px'}}>
                         <Link to="/master-dashboard">
                             <Button variant="primary">Master dashboard</Button>
                         </Link>
                    {" "}
                         <Link to="/client">
                             <Button variant="primary">Launch client</Button>
                         </Link>
                    </div>
                </Card.Body >
            </Card>

        </div>
    );
};
