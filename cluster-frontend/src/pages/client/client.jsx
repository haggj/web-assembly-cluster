import React, { useEffect, useState } from 'react';

export const Client = () => {
    const [test, setTest] = useState('Client');

    return (
        <h3>Page {test}</h3>
    );
};
