document.addEventListener('DOMContentLoaded', function () {

    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        contactForm.setAttribute('novalidate', true);

        const nameInput = document.getElementById('fullname');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const submitBtn = contactForm.querySelector('button[type="submit"]');

        const MIN_MESSAGE_LENGTH = 20;
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const showToast = (message, type = 'success') => {
            const container = document.getElementById('toast-container');

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            const iconSymbol = type === 'success' ? '✓' : '✕';

            toast.innerHTML = `
                <span class="toast-icon" style="font-weight:bold; font-size:18px;">${iconSymbol}</span>
                <span>${message}</span>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('hide');
                toast.addEventListener('animationend', () => {
                    toast.remove();
                });
            }, 3000);
        };

        const simulateAPI = (formData) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const isSuccess = Math.random() > 0.3;

                    if (isSuccess) {
                        resolve({ status: 200, message: 'Message sent successfully!' });
                    } else {
                        reject({ status: 500, message: 'Server error. Please try again.' });
                    }
                }, 1500);
            });
        };

        const showError = (input, message) => {
            const formGroup = input.parentElement;
            clearError(input);
            formGroup.classList.add('error');
            const errorDiv = document.createElement('small');
            errorDiv.className = 'error-message';
            errorDiv.innerText = message;
            formGroup.appendChild(errorDiv);
        };
        const clearError = (input) => {
            const formGroup = input.parentElement;
            formGroup.classList.remove('error');
            const errorDisplay = formGroup.querySelector('.error-message');
            if (errorDisplay) errorDisplay.remove();
        };

        const checkInput = (input) => {
            const value = input.value.trim();
            const id = input.id;
            let isValid = true;
            if (id === 'fullname') {
                if (value === '') { showError(input, 'Full Name is required.'); isValid = false; }
                else { clearError(input); }
            } else if (id === 'email') {
                if (value === '') { showError(input, 'Email is required.'); isValid = false; }
                else if (!EMAIL_REGEX.test(value)) { showError(input, 'Invalid email format.'); isValid = false; }
                else { clearError(input); }
            } else if (id === 'message') {
                if (value === '') { showError(input, 'Message is required.'); isValid = false; }
                else if (value.length < MIN_MESSAGE_LENGTH) { showError(input, `Minimum ${MIN_MESSAGE_LENGTH} characters required.`); isValid = false; }
                else { clearError(input); }
            }
            return isValid;
        };

        [nameInput, emailInput, messageInput].forEach(input => {
            input.addEventListener('blur', () => checkInput(input));
            input.addEventListener('input', () => {
                if (input.parentElement.classList.contains('error')) clearError(input);
            });
        });

        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const isNameValid = checkInput(nameInput);
            const isEmailValid = checkInput(emailInput);
            const isMessageValid = checkInput(messageInput);

            if (isNameValid && isEmailValid && isMessageValid) {

                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
                submitBtn.innerHTML = 'Sending...';

                try {
                    const response = await simulateAPI({
                        name: nameInput.value,
                        email: emailInput.value,
                        message: messageInput.value
                    });

                    showToast(response.message, 'success');
                    contactForm.reset();

                    submitBtn.classList.remove('loading');
                    submitBtn.classList.add('success');
                    submitBtn.innerHTML = 'Sent! ✓';

                } catch (error) {
                    console.error(error);
                    showToast(error.message, 'error');

                    submitBtn.classList.remove('loading');
                    submitBtn.innerHTML = 'Retry';
                } finally {
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('success', 'loading');
                        submitBtn.innerHTML = originalBtnText;
                    }, 3000);
                }
            }
        });
    }
});