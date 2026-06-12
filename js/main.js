const API_URL = 'http://localhost:5000/api';

function getToken() {
    return localStorage.getItem('token');
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function apiRequest(endpoint, method = 'GET', data = null) {

    try {

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const token = getToken();

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);

        return await response.json();

    } catch (error) {

        console.error(error);

        return {
            success: false,
            message: 'Server connection failed'
        };
    }
}