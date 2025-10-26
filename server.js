const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Fungsi untuk membaca data users dari file
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Jika file belum ada, return array kosong
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

// Fungsi untuk menulis data users ke file
async function writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Endpoint untuk register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validasi input
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Semua field harus diisi' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password harus minimal 6 karakter' 
            });
        }

        // Baca users yang ada
        const users = await readUsers();

        // Cek apakah email sudah terdaftar
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email sudah terdaftar' 
            });
        }

        // Tambah user baru
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password, // Di produksi, password harus di-hash!
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        // Simpan ke file
        await writeUsers(users);

        res.json({ 
            success: true, 
            message: 'Registrasi berhasil!' 
        });
    } catch (error) {
        console.error('Error registrasi:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
});

// Endpoint untuk login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email dan password harus diisi' 
            });
        }

        // Baca users dari file
        const users = await readUsers();

        // Cari user
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email atau password salah' 
            });
        }

        // Kirim data user (tanpa password)
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({ 
            success: true, 
            message: 'Login berhasil!',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
});

// Endpoint untuk mendapatkan semua users (opsional, untuk testing)
app.get('/api/users', async (req, res) => {
    try {
        const users = await readUsers();
        // Hapus password dari response
        const usersWithoutPassword = users.map(({ password, ...user }) => user);
        res.json(usersWithoutPassword);
    } catch (error) {
        console.error('Error get users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});