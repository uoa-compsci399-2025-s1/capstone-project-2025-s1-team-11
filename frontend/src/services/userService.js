import User from '../models/User';
// For demonstration, using a simple in-memory array as data storage.
// In a real app, you might use IndexedDB, localStorage, or an API.

let users = [];

export const createUser = (userData) => {
    const newUser = new User({ id: Date.now(), ...userData });
    users.push(newUser);
    return newUser;
};

export const getUsers = () => {
    return users;
};

export const updateUser = (id, newData) => {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
        users[index] = { ...users[index], ...newData };
        return users[index];
    }
    return null;
};

export const deleteUser = (id) => {
    users = users.filter(user => user.id !== id);
    return true;
};