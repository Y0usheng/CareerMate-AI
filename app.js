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
            if (errorDisplay) {
                errorDisplay.remove();
            }
        };

        const checkInput = (input) => {
            const value = input.value.trim();
            const id = input.id;
            let isValid = true;

            if (id === 'fullname') {
                if (value === '') {
                    showError(input, 'Full Name is required.');
                    isValid = false;
                } else {
                    clearError(input);
                }
            }

            else if (id === 'email') {
                if (value === '') {
                    showError(input, 'Email address is required.');
                    isValid = false;
                } else if (!EMAIL_REGEX.test(value)) {
                    showError(input, 'Please enter a valid email (e.g., user@example.com).');
                    isValid = false;
                } else {
                    clearError(input);
                }
            }

            else if (id === 'message') {
                if (value === '') {
                    showError(input, 'Message cannot be empty.');
                    isValid = false;
                } else if (value.length < MIN_MESSAGE_LENGTH) {
                    showError(input, `Message must be at least ${MIN_MESSAGE_LENGTH} characters. (Current: ${value.length})`);
                    isValid = false;
                } else {
                    clearError(input);
                }
            }

            return isValid;
        };


        [nameInput, emailInput, messageInput].forEach(input => {
            input.addEventListener('blur', () => {
                checkInput(input);
            });
        });

        [nameInput, emailInput, messageInput].forEach(input => {
            input.addEventListener('input', () => {
                const formGroup = input.parentElement;
                if (formGroup.classList.contains('error')) {
                    clearError(input);
                }
            });
        });

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const isNameValid = checkInput(nameInput);
            const isEmailValid = checkInput(emailInput);
            const isMessageValid = checkInput(messageInput);

            if (isNameValid && isEmailValid && isMessageValid) {

                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
                submitBtn.innerHTML = 'Sending...';

                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    submitBtn.classList.add('success');
                    submitBtn.innerHTML = 'Message Sent! ✓';
                    contactForm.reset();

                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('success');
                        submitBtn.innerHTML = originalBtnText;
                    }, 3000);
                }, 2000);
            }
        });
    }
});