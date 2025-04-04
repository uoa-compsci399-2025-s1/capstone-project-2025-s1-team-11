import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        setUsers(getUsers());
    }, []);

    const handleCreateUser = () => {
        createUser({ name, email });
        setUsers(getUsers());
        setName('');
        setEmail('');
    };

    return (
        <div>
            <h1>Users</h1>
            <div>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={handleCreateUser}>Create User</button>
            </div>
            <ul>
                {users.map(user => (
                    <li key={user.id}>
                        {user.name} ({user.email})
                        {/* Add buttons or actions for update and delete as needed */}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Users;