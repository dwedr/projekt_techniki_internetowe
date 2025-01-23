// Input validation
function validateAnimationInputs(k, m, A, b, phi) {
    let flagNotProvided = false;
    const errors = [];
    if (!k) { errors.push('Stała sprężystości (k) nie podana.'); flagNotProvided = true; }
    if (!m) { errors.push('Masa (m) nie podana.'); flagNotProvided = true; }
    if (!A) { errors.push('Amplituda (A) nie podana.'); flagNotProvided = true; }
    if (phi === '') { errors.push('Przesunięcie fazowe (φ) nie podane.'); flagNotProvided = true; }
    if (b === '') { errors.push('Współczynnik tłumienia (b) nie podany.'); flagNotProvided = true; }

    if (flagNotProvided) return errors;

    if (parseFloat(k) <= 0 || parseFloat(k) > 100) errors.push('Stała sprężystości (k) musi być większa od 0 i niewiększa niż 100.');
    if (parseFloat(m) <= 0 || parseFloat(m) > 100) errors.push('Masa (m)  musi być większa od 0 i niewiększa niż 100.');
    if (parseFloat(A) < 0 || parseFloat(A) > 170) errors.push('Amplituda (A)  musi być większa lub równa 0 i niewiększa niż 170.');
    if (parseFloat(b) < 0 || parseFloat(b) > 2 * Math.sqrt(parseFloat(m) * parseFloat(k))) errors.push('Współczynnik tłumienia (b) musi być większy lub równy 0 i mniejszy niż 2 * sqrt(k * m).');
    return errors;
}

// Article navigation
function navigateTo(sectionId) {
    saveCurrentSection(sectionId); // Save the current section to sessionStorage
    const articles = document.querySelectorAll('main > article');

    articles.forEach(article => {
        article.style.display = 'none';
        article.style.flexDirection = '';
    });

    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        // Specific display for animation section
        if (sectionId === 'animacja') {
            targetSection.style.display = 'flex';
            targetSection.style.alignItems = 'flex-start';
            targetSection.style.gap = '20px';

            let k = document.getElementById('k').value;
            let m = document.getElementById('m').value;
            let A = document.getElementById('amplitude').value;
            let phi = document.getElementById('phi').value;
            const dampingEnabled = document.getElementById('dampingCheckbox').checked;
            let b = dampingEnabled ? document.getElementById('b').value : '0';
            //console.log(phi);
            // Validate inputs
            if (!k) document.getElementById('k').value = 10;
            if (!m) document.getElementById('m').value = 1;
            if (!A) document.getElementById('amplitude').value = 100;
            if (phi === '') document.getElementById('phi').value = 0;
            if (b === '') document.getElementById('b').value = 0, 5;

            if (parseFloat(k) <= 0 || parseFloat(k) > 100) document.getElementById('k').value = 10;
            if (parseFloat(m) <= 0 || parseFloat(m) > 100) document.getElementById('m').value = 1;
            if (parseFloat(A) < 0 || parseFloat(A) > 170) document.getElementById('amplitude').value = 100;
            if (parseFloat(b) < 0 || parseFloat(b) > 2 * Math.sqrt(parseFloat(m) * parseFloat(k))) document.getElementById('b').value = 0.5;

            A = parseFloat(document.getElementById('amplitude').value);




            const canvas = document.getElementById('animacjaCanvas');
            const ctx = canvas.getContext('2d');

            function drawSpring(x, yStart, yEnd, numZigs) {
                const zigHeight = (yEnd - yStart) / numZigs;
                const zigWidth = 15;

                ctx.beginPath();
                ctx.moveTo(x, yStart);
                for (let i = 0; i < numZigs; i++) {
                    const direction = i % 2 === 0 ? -1 : 1;
                    const nextX = x + direction * zigWidth;
                    const nextY = yStart + zigHeight * (i + 1);
                    ctx.lineTo(nextX, nextY);
                }
                ctx.strokeStyle = 'gray';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Draw static spring and ball
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const ballX = canvas.width / 2;
            const ballY = canvas.height / 2 + A;

            drawSpring(ballX, 0, ballY - 8, 10);

            ctx.beginPath();
            ctx.arc(ballX, ballY, 20, 0, 2 * Math.PI);
            ctx.fillStyle = 'blue';
            ctx.fill();
            ctx.stroke();
        }
        else if (sectionId === 'rejestracja') {
            targetSection.style.display = 'block';
            document.getElementById('r_username').value = '';
            document.getElementById('r_password').value = '';
            document.getElementById('confirmPassword').value = '';

            document.getElementById('registerMessage').innerHTML = '';
        }
        else if (sectionId === 'login') {
            targetSection.style.display = 'block';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';

            document.getElementById('loginMessage').innerHTML = '';
        }
        else {
            // For other sections, block display
            targetSection.style.display = 'block';
        }
    } else {
        console.error(`Section with ID '${sectionId}' not found.`);
    }
}


// Update functionality upon login
function updateLoginStatus() {
    const registerBtn = document.getElementById('registerBtn');
    const loginButton = document.getElementById('loginBtn');
    const saveSettingsBtn = document.getElementById('zapiszUstawienia');
    const retrieveSettingsButton = document.getElementById('przywrocUstawienia');
    saveSettingsBtn.style.display = 'block';
    registerBtn.style.display = 'none';
    retrieveSettingsButton.style.display = 'block';
    loginButton.id = 'logoutBtn';
    loginButton.textContent = 'Wyloguj';
    loginButton.removeEventListener('click', () => navigateTo('login'));
    loginButton.addEventListener('click', logout);
}

// Logout function with JWT handling
async function logout() {
    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');

    try {
        const response = await fetch('http://localhost:3051/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            // Refresh token handling upon failed logout
            const refreshResponse = await fetch('http://localhost:3051/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
                const { accessToken: newAccessToken } = await refreshResponse.json();
                sessionStorage.setItem('accessToken', newAccessToken);

                // Retry logout
                const retryResponse = await fetch('http://localhost:3051/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${newAccessToken}`,
                    },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!retryResponse.ok) throw new Error('Logout failed after refresh.');
            } else {
                throw new Error('Token refresh failed.');
            }
        }
    } catch (error) {
        console.error('Error during logout:', error);
    } finally {
        // Clear sessionStorage and reset the buttons
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        const saveSettingsBtn = document.getElementById('zapiszUstawienia');
        const retrieveSettingsButton = document.getElementById('przywrocUstawienia');
        saveSettingsBtn.style.display = 'none';
        retrieveSettingsButton.style.display = 'none';

        const logoutButton = document.getElementById('logoutBtn');
        logoutButton.id = 'loginBtn';
        logoutButton.textContent = 'Zaloguj';
        logoutButton.removeEventListener('click', logout);
        logoutButton.addEventListener('click', () => navigateTo('login'));
        const registerBtn = document.getElementById('registerBtn');
        registerBtn.style.display = 'block';
        navigateTo('stronaGlowna');
    }
}


// Update login status based on sessionStorage
function updateLoginStatusOnRefresh() {
    const accessToken = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    const lastSection = sessionStorage.getItem('lastSection') || 'stronaGlowna'; // Default to main page

    if (accessToken || refreshToken) {
        // User is logged in
        updateLoginStatus();
        navigateTo(lastSection);
    } else {
        // User is not logged in
        navigateTo('stronaGlowna');
    }
}


// Save current section to sessionStorage
function saveCurrentSection(sectionId) {
    sessionStorage.setItem('lastSection', sectionId);
}

//Onload settings
window.onload = function () {

    // Adding event listeners for navigation buttons
    document.getElementById('stronaGlownaButton').addEventListener('click', () => navigateTo('stronaGlowna'));
    document.getElementById('animacjaBtn').addEventListener('click', () => navigateTo('animacja'));
    document.getElementById('loginBtn').addEventListener('click', () => navigateTo('login'));
    document.getElementById('registerBtn').addEventListener('click', () => navigateTo('rejestracja'));

    // Add event listener for the registration form
    document.getElementById('registerSubmitBtn').addEventListener('click', async (event) => {
        event.preventDefault();
        const username = document.getElementById('r_username').value;
        const password = document.getElementById('r_password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const messageDiv = document.getElementById('registerMessage');
        messageDiv.innerHTML = '';

        if (!username || !password || !confirmPassword) {
            messageDiv.innerHTML = 'Wszystkie pola muszą być wypełnione.';
            return;
        }

        if (password !== confirmPassword) {
            messageDiv.innerHTML = 'Hasła muszą być takie same.';
            return;
        }

        try {
            const response = await fetch('http://localhost:3051/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.status === 201) {
                const data = await response.json();
                messageDiv.innerHTML = `Rejestracja powiodła się! ID użytkownika: ${data.userId}`;
            } else if (response.status === 409) {
                messageDiv.innerHTML = 'Użytkownik o podanej nazwie już istnieje.';
            } else {
                const errorText = await response.text();
                messageDiv.innerHTML = `Błąd: ${errorText}`;
            }
        } catch (error) {
            console.error('Error during registration:', error);
            messageDiv.innerHTML = 'Wystąpił błąd podczas rejestracji.';
        }
    });


    // Add event listener for the login form
    document.getElementById('submitLoginBtn').addEventListener('click', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const messageDiv = document.getElementById('loginMessage');
        messageDiv.innerHTML = '';

        if (!username || !password) {
            messageDiv.innerHTML = 'Nazwa użytkownika i hasło są wymagane.';
            return;
        }

        try {
            const response = await fetch('http://localhost:3051/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.status === 200) {
                const data = await response.json();
                sessionStorage.setItem('accessToken', data.accessToken);
                sessionStorage.setItem('refreshToken', data.refreshToken);
                updateLoginStatus();
                navigateTo('stronaGlowna');
            } else if (response.status === 400) {
                messageDiv.innerHTML = 'Błąd: Nazwa użytkownika lub hasło są nieprawidłowe.';
            } else {
                const errorText = await response.text();
                messageDiv.innerHTML = `Błąd: ${errorText}`;
            }
        } catch (error) {
            console.error('Error during login:', error);
            messageDiv.innerHTML = 'Wystąpił błąd podczas logowania.';
        }
    });
    //refreshHandling
    updateLoginStatusOnRefresh();
    // Animation: Damped oscillation of a ball on a spring
    let animationFrame;
    let t = 0;


    document.getElementById('dampingCheckbox').addEventListener('change', function () {
        document.getElementById('dampingField').style.display = this.checked ? 'block' : 'none';
    });

    document.getElementById('startAnimacja').addEventListener('click', () => {
        let trails = []; // Array to store trail points
        let velocityTrails = []; // Array to store velocity plot points
        let aclTrails = []; // Array to store velocity plot points

        let velScalar, aclScalar, eScalar;
        // Energy plot points
        const energyTrails = {
            kinetic: [],
            potential: []
        };

        let k = document.getElementById('k').value;
        let m = document.getElementById('m').value;
        let A = document.getElementById('amplitude').value;
        let phi = document.getElementById('phi').value;
        const dampingEnabled = document.getElementById('dampingCheckbox').checked;
        let b = dampingEnabled ? document.getElementById('b').value : '0';
        //console.log(phi);
        // Validate inputs
        const errors = validateAnimationInputs(k, m, A, b, phi);
        if (errors.length > 0) {
            alert(`Errors:\n${errors.join('\n')}`);
            return;
        }
        k = parseFloat(k);
        m = parseFloat(m);
        A = parseFloat(A);
        phi = parseFloat(phi);
        b = parseFloat(b);

        const omega0 = Math.sqrt(k / m);
        const omegaD = dampingEnabled ? Math.sqrt(omega0 ** 2 - (b / (2 * m)) ** 2) : omega0;

        let t = 0;
        const dt = 0.016;
        const canvas = document.getElementById('animacjaCanvas');
        const ctx = canvas.getContext('2d');

        function drawTrailings(ballX, ballY) {
            //Moving points to the left
            for (let i = trails.length - 1; i >= 0; i--) {
                const trail = trails[i];
                trail.x -= 2;

                // Remove the trail point if it goes out of bounds
                if (trail.x < 0) {
                    trails.splice(i, 1);
                } else {
                    // Draw the trail point if still within bounds
                    ctx.beginPath();
                    ctx.arc(trail.x, trail.y, 2, 0, 2 * Math.PI);
                    ctx.fillStyle = 'black';
                    ctx.fill();

                    if (i < trails.length - 1) {
                        ctx.moveTo(trails[i + 1].x, trails[i + 1].y);
                        ctx.lineTo(trails.x, trails.y);
                    }
                }
            }

            // Append the new ball position as a trail point
            trails.push({ x: ballX, y: ballY });
        }

        function calculateScalars() {
            const maxVelocity = A * omegaD; // Maximum velocity
            const maxAcceleration = A * omegaD ** 2; // Maximum acceleration
            const maxKineticEnergy = 0.5 * m * (A * omegaD) ** 2; // Maximum kinetic energy
            const maxPotentialEnergy = 0.5 * k * A ** 2; // Maximum potential energy

            // Compute scalars to fit values within ±20 pixels
            velScalar = 20 / maxVelocity;
            aclScalar = 20 / maxAcceleration;
            eScalar = 60 / Math.max(maxKineticEnergy, maxPotentialEnergy);
        }

        function drawVelocity() {
            // Calculate velocity and update velocity plot
            const velocity = -A * Math.exp(-b * t / (2 * m)) * (omegaD * Math.sin(omegaD * t + phi) + (b / (2 * m)) * Math.cos(omegaD * t + phi));
            const velocityCanvasY = 75 - (velocity * velScalar); // Scale and translate velocity to fit in upper right corner

            velocityTrails.push({ x: 750, y: velocityCanvasY }); // Append velocity plot point

            for (let i = velocityTrails.length - 1; i >= 0; i--) {
                const vTrail = velocityTrails[i];
                vTrail.x -= 2; // Move the velocity plot point to the left

                // Remove points that exceed threshold
                if (vTrail.x < 600) {
                    velocityTrails.splice(i, 1);
                } else {
                    // Draw the velocity plot point
                    ctx.beginPath();
                    ctx.arc(vTrail.x, vTrail.y, 1, 0, 2 * Math.PI);
                    ctx.fillStyle = 'green';
                    ctx.fill();
                }
            }

            // Label the velocity plot
            ctx.font = '12px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText('V(t)', 550, 20);
        }

        function drawAcceleration() {
            // Calculate acceleration
            const acceleration = -A * Math.exp(-b * t / (2 * m)) * (
                omegaD ** 2 * Math.cos(omegaD * t + phi) - (b / m) * omegaD * Math.sin(omegaD * t + phi)
            );

            // Scale and translate acceleration to fit in the canvas area
            const accelerationCanvasY = 200 - (acceleration * aclScalar);

            // Append acceleration plot point
            aclTrails.push({ x: 750, y: accelerationCanvasY });

            // Draw acceleration points
            for (let i = aclTrails.length - 1; i >= 0; i--) {
                const aclTrail = aclTrails[i];
                aclTrail.x -= 2; // Move the acceleration plot point to the left

                // Remove points that exceed threshold
                if (aclTrail.x < 600) {
                    aclTrails.splice(i, 1);
                } else {
                    // Draw the acceleration plot point
                    ctx.beginPath();
                    ctx.arc(aclTrail.x, aclTrail.y, 1, 0, 2 * Math.PI);
                    ctx.fillStyle = 'purple';
                    ctx.fill();
                }
            }

            // Label the acceleration plot
            ctx.font = '12px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText('a(t)', 550, 160); // Position of the label
        }

        function drawEnergy() {
            // Calculate position and velocity
            const x = A * Math.exp(-b * t / (2 * m)) * Math.cos(omegaD * t + phi);
            const v = -A * Math.exp(-b * t / (2 * m)) * (
                omegaD * Math.sin(omegaD * t + phi) + (b / (2 * m)) * Math.cos(omegaD * t + phi)
            );
            // Calculate energies
            const kineticEnergy = 0.5 * m * v ** 2;
            const potentialEnergy = 0.5 * k * x ** 2;

            // Scale and translate energies to fit the canvas area
            const kineticCanvasY = 370 - (kineticEnergy * eScalar);
            const potentialCanvasY = 370 - (potentialEnergy * eScalar);

            // Append energy plot points
            energyTrails.kinetic.push({ x: 750, y: kineticCanvasY });
            energyTrails.potential.push({ x: 750, y: potentialCanvasY });

            // Draw kinetic energy points
            for (let i = energyTrails.kinetic.length - 1; i >= 0; i--) {
                const keTrail = energyTrails.kinetic[i];
                keTrail.x -= 2; // Move the kinetic energy plot point to the left

                // Remove points that exceed threshold
                if (keTrail.x < 600) {
                    energyTrails.kinetic.splice(i, 1);
                } else {
                    // Draw the kinetic energy plot point
                    ctx.beginPath();
                    ctx.arc(keTrail.x, keTrail.y, 1, 0, 2 * Math.PI);
                    ctx.fillStyle = 'blue';
                    ctx.fill();
                }
            }

            // Draw potential energy points
            for (let i = energyTrails.potential.length - 1; i >= 0; i--) {
                const peTrail = energyTrails.potential[i];
                peTrail.x -= 2; // Move the potential energy plot point to the left

                // Remove points that exceed threshold
                if (peTrail.x < 600) {
                    energyTrails.potential.splice(i, 1);
                } else {
                    // Draw the potential energy plot point
                    ctx.beginPath();
                    ctx.arc(peTrail.x, peTrail.y, 1, 0, 2 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                }
            }

            // Label the energy plot
            ctx.font = '12px Arial';
            ctx.fillStyle = 'blue';
            ctx.fillText('Ek(t)', 550, 280); // Position of the kinetic energy label
            ctx.fillStyle = 'red';
            ctx.fillText('Ep(t)', 550, 300); // Position of the potential energy label
        }


        // Drawing spring as zig zag
        function drawSpring(x, yStart, yEnd, numZigs) {
            const zigHeight = (yEnd - yStart) / numZigs;
            const zigWidth = 15;

            ctx.beginPath();
            ctx.moveTo(x, yStart);
            for (let i = 0; i < numZigs; i++) {
                const direction = i % 2 === 0 ? -1 : 1;
                const nextX = x + direction * zigWidth;
                const nextY = yStart + zigHeight * (i + 1);
                ctx.lineTo(nextX, nextY);
            }
            ctx.strokeStyle = 'gray';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate ball position
            const x = A * Math.exp((-b / (2 * m)) * t) * Math.cos(omegaD * t + phi);
            const ballX = canvas.width / 2;
            const ballY = canvas.height / 2 + x; // Set the ball position to oscillate

            // Draw spring from top of canvas to ball
            drawSpring(ballX, 0, ballY - 8, 10);
            calculateScalars();
            // Draw trailings
            drawTrailings(ballX, ballY);
            // Draw velocity
            drawVelocity();
            // Draw acceleration
            drawAcceleration();
            // Draw energy
            drawEnergy();
            // Draw ball
            ctx.beginPath();
            ctx.arc(ballX, ballY, 20, 0, 2 * Math.PI);
            ctx.fillStyle = 'blue';
            ctx.fill();
            ctx.stroke();

            t += dt;
            animationFrame = requestAnimationFrame(animate);
        }

        if (animationFrame) cancelAnimationFrame(animationFrame);
        animate();
    });


    document.getElementById('stopAnimmacji').addEventListener('click', () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = null;

        function drawSpring(x, yStart, yEnd, numZigs) {
            const zigHeight = (yEnd - yStart) / numZigs;
            const zigWidth = 15;

            ctx.beginPath();
            ctx.moveTo(x, yStart);
            for (let i = 0; i < numZigs; i++) {
                const direction = i % 2 === 0 ? -1 : 1;
                const nextX = x + direction * zigWidth;
                const nextY = yStart + zigHeight * (i + 1);
                ctx.lineTo(nextX, nextY);
            }
            ctx.strokeStyle = 'gray';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Reset canvas
        const canvas = document.getElementById('animacjaCanvas');
        const ctx = canvas.getContext('2d');
        const A = parseFloat(document.getElementById('amplitude').value);
        const ballX = canvas.width / 2;
        const ballY = canvas.height / 2 + A;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawSpring(ballX, 0, ballY - 8, 10);
        ctx.beginPath();
        ctx.arc(ballX, ballY, 20, 0, 2 * Math.PI);

        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.stroke();
    });
};



// Function to save animation settings
async function saveAnimationSettings() {
    let k = document.getElementById('k').value;
    let m = document.getElementById('m').value;
    let A = document.getElementById('amplitude').value;
    let phi = document.getElementById('phi').value;
    const dampingEnabled = document.getElementById('dampingCheckbox').checked;
    let b = dampingEnabled ? document.getElementById('b').value : '0';

    // Validate inputs
    const errors = validateAnimationInputs(k, m, A, b, phi);
    if (errors.length > 0) {
        alert(`Errors:\n${errors.join('\n')}`);
        return;
    }

    k = parseFloat(k);
    m = parseFloat(m);
    A = parseFloat(A);
    phi = parseFloat(phi);
    b = parseFloat(b);

    const settings = {
        spring_constant: k,
        mass: m,
        amplitude: A,
        phase: phi,
        damping_coefficient: document.getElementById('dampingCheckbox').checked ? b : null
    };
    // Validate inputs

    try {
        const response = await fetch('http://localhost:3051/animation-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(settings),
        });

        if (!response.ok) {
            // Handle token refresh
            const refreshResponse = await fetch('http://localhost:3051/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: sessionStorage.getItem('refreshToken') }),
            });

            if (refreshResponse.ok) {
                const { accessToken } = await refreshResponse.json();
                sessionStorage.setItem('accessToken', accessToken);

                // Retry saving settings
                const retryResponse = await fetch('http://localhost:3051/animation-settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(settings),
                });

                if (!retryResponse.ok) throw new Error('Failed to save settings after refresh.');
            } else {
                throw new Error('Token refresh failed.');
            }
        }

        alert('Zapisano!');
    } catch (error) {
        console.error('Error saving settings:', error);
        logout();
    }
}

// Function to retrieve animation settings
async function retrieveAnimationSettings() {
    try {
        const response = await fetch('http://localhost:3051/animation-settings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
            },
        });

        if (response.status === 404) {
            console.log('No saved settings found for this user.');
            alert("Brak zapisanych ustawień");
            return; // Exit without changing settings
        }

        if (!response.ok) {
            // If retrieval fails, handle token refresh
            const refreshResponse = await fetch('http://localhost:3051/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: sessionStorage.getItem('refreshToken') }),
            });

            if (refreshResponse.ok) {
                const { accessToken } = await refreshResponse.json();
                sessionStorage.setItem('accessToken', accessToken);

                // Retry retrieving settings
                const retryResponse = await fetch('http://localhost:3051/animation-settings', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (retryResponse.status === 404) {
                    console.log('No saved settings found for this user after token refresh.');
                    alert("Brak zapisanych ustawień");
                    return; // Exit without changing settings
                }

                if (!retryResponse.ok) throw new Error('Failed to retrieve settings after refresh.');

                const data = await retryResponse.json();
                applyAnimationSettings(data);
                return;
            } else {
                throw new Error('Token refresh failed.');
            }
        }

        const data = await response.json();
        applyAnimationSettings(data);
    } catch (error) {
        console.error('Error retrieving settings:', error);
        logout();
    }
}


// Function to apply retrieved settings to the form
function applyAnimationSettings(settings) {
    document.getElementById('k').value = settings.spring_constant;
    document.getElementById('m').value = settings.mass;
    document.getElementById('amplitude').value = settings.amplitude;
    document.getElementById('phi').value = settings.phase;

    if (settings.damping_coefficient !== null) {
        document.getElementById('dampingCheckbox').checked = true;
        document.getElementById('dampingField').style.display = 'block';
        document.getElementById('b').value = settings.damping_coefficient;
    } else {
        document.getElementById('dampingCheckbox').checked = false;
        document.getElementById('dampingField').style.display = 'none';
    }
}

// Adding event listeners to save and retrieve buttons
document.getElementById('zapiszUstawienia').addEventListener('click', saveAnimationSettings);
document.getElementById('przywrocUstawienia').addEventListener('click', retrieveAnimationSettings);
