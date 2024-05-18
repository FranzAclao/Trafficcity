const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Replace with your MySQL password
    database: 'trafficcity' // Replace with your database name
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

app.get('/vehicles/check-license/:licensePlate', (req, res) => {
    const { licensePlate } = req.params;

    const sql = 'SELECT * FROM vehicles WHERE license_plate = ?';
    db.query(sql, [licensePlate], (err, results) => {
        if (err) {
            console.error('Error checking license plate:', err);
            res.status(500).json({ error: 'Error checking license plate' });
            return;
        }
        
        if (results.length > 0) {
            res.status(400).json({ error: 'License already registered' });
        } else {
            res.status(200).json({ message: 'License available' });
        }
    });
});

app.get('/vehicles', (req, res) => {
    const sql = 'SELECT * FROM vehicles';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching vehicle data: ' + err.stack);
            res.status(500).send('Error fetching vehicle data');
            return;
        }
        res.json(results);
    });
});



app.get('/vehicles/search', (req, res) => {
    const { id, licensePlate } = req.query;

    if (id) {
        const sql = 'SELECT * FROM vehicles WHERE id = ?';
        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('Error fetching vehicle details:', err);
                res.status(500).json({ error: 'Error fetching vehicle details' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ error: 'Vehicle not found' });
                return;
            }
            res.json(results[0]);
        });
    } else if (licensePlate) {
        const sql = 'SELECT * FROM vehicles WHERE license_plate = ?';
        db.query(sql, [licensePlate], (err, results) => {
            if (err) {
                console.error('Error fetching vehicle details:', err);
                res.status(500).json({ error: 'Error fetching vehicle details' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ error: 'Vehicle not found' });
                return;
            }
            res.json(results[0]);
        });
    } else {
        res.status(400).json({ error: 'Invalid search parameters' });
    }
});

app.post('/register-vehicle', (req, res) => {
    const { vehicleClass, carMake, carModel, licensePlate } = req.body;

    // Check if the license plate already exists
    const checkSql = 'SELECT * FROM vehicles WHERE license_plate = ?';
    db.query(checkSql, [licensePlate], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error checking license plate:', checkErr.stack);
            res.status(500).json({ success: false, message: 'Error checking license plate' });
            return;
        }

        if (checkResult.length > 0) {
            // License plate already exists
            res.status(400).json({ success: false, message: 'License already registered' });
            return;
        }

        // Insert the new vehicle information
        const sql = 'INSERT INTO vehicles (vehicle_class, car_make, car_model, license_plate) VALUES (?, ?, ?, ?)';
        db.query(sql, [vehicleClass, carMake, carModel, licensePlate], (err, result) => {
            if (err) {
                console.error('Error inserting vehicle information:', err.stack);
                res.status(500).json({ success: false, message: 'Error registering vehicle information' });
                return;
            }

            // Assuming you have an auto-increment primary key "id" in your table
            const insertedVehicleId = result.insertId;

            // Retrieve the newly inserted vehicle from the database
            const selectSql = 'SELECT * FROM vehicles WHERE id = ?';
            db.query(selectSql, [insertedVehicleId], (selectErr, selectResult) => {
                if (selectErr) {
                    console.error('Error fetching newly inserted vehicle:', selectErr.stack);
                    res.status(500).json({ success: false, message: 'Error fetching newly inserted vehicle' });
                    return;
                }

                const newVehicle = selectResult[0]; // Assuming selectResult is an array with one element

                // Send the newly inserted vehicle data as JSON response
                res.status(200).json(newVehicle);
            });
        });
    });
});
app.delete('/delete-vehicle/:id', (req, res) => {
    const vehicleId = req.params.id;
    const sql = 'DELETE FROM vehicles WHERE id = ?';
    db.query(sql, [vehicleId], (err, result) => {
        if (err) {
            console.error('Error deleting vehicle information: ' + err.stack);
            res.status(500).send('Error deleting vehicle information');
            return;
        }
        res.send('Vehicle information deleted successfully!');
    });
});

app.put('/vehicles/:id', (req, res) => {
    const vehicleId = req.params.id;
    const { vehicleClass, carMake, carModel, licensePlate } = req.body;

    const sql = 'UPDATE vehicles SET vehicle_class = ?, car_make = ?, car_model = ?, license_plate = ? WHERE id = ?';
    db.query(sql, [vehicleClass, carMake, carModel, licensePlate, vehicleId], (err, result) => {
        if (err) {
            console.error('Error updating vehicle information: ' + err.stack);
            res.status(500).send('Error updating vehicle information');
            return;
        }
        res.send('Vehicle information updated successfully!');
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
