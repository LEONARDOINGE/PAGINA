const authSystem = {
    currentUser: JSON.parse(localStorage.getItem("fotovecCurrentUser")) || null,

    async register(name, username, email, password) {
        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, username, email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.error };
            }
        } catch (error) {
            return { success: false, message: "Error de conexión" };
        }
    },

    async login(usernameOrEmail, password) {
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ usernameOrEmail, password }),
            });
            const data = await response.json();
            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem("fotovecCurrentUser", JSON.stringify(this.currentUser));
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.error };
            }
        } catch (error) {
            return { success: false, message: "Error de conexión" };
        }
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem("fotovecCurrentUser");
    }
};
