const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function fetchLogs() {
    try {
        const response = await fetch(`${API_URL}/logs`);
        if (!response.ok) throw new Error('Failed to fetch logs');
        return await response.json();
    } catch (error) {
        console.error('Error fetching logs:', error);
        return {};
    }
}

export async function fetchLog(dateStr) {
    try {
        const response = await fetch(`${API_URL}/logs/${dateStr}`);
        if (!response.ok) throw new Error('Failed to fetch log');
        return await response.json();
    } catch (error) {
        console.error('Error fetching log:', error);
        return null;
    }
}

export async function saveLog(dateStr, entry) {
    try {
        const response = await fetch(`${API_URL}/logs/${dateStr}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entry }),
        });
        if (!response.ok) throw new Error('Failed to save log');
        return await response.json();
    } catch (error) {
        console.error('Error saving log:', error);
        throw error;
    }
}

export async function deleteLog(dateStr) {
    try {
        const response = await fetch(`${API_URL}/logs/${dateStr}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete log');
        return await response.json();
    } catch (error) {
        console.error('Error deleting log:', error);
        throw error;
    }
}
