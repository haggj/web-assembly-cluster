import React, { useEffect, useState } from 'react';

export const MasterDashboard = () => {
    const [test, setTest] = useState('Master Dashboard');

    return (
        <h3>Page {test}</h3>
    );
};
