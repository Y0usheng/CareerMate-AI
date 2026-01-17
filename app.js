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

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const nameInput = document.getElementById('fullname');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            const submitBtn = contactForm.querySelector('button[type="submit"]');

            let isValid = true;

            const validateField = (input, errorMsg) => {
                const formGroup = input.parentElement;
                const existingError = formGroup.querySelector('.error-message');
                if (existingError) existingError.remove();

                if (!input.value.trim()) {
                    formGroup.classList.add('error');
                    const errorDiv = document.createElement('span');
                    errorDiv.className = 'error-message';
                    errorDiv.innerText = errorMsg;
                    formGroup.appendChild(errorDiv);
                    return false;
                } else {
                    formGroup.classList.remove('error');
                    return true;
                }
            };

            const isNameValid = validateField(nameInput, 'Please enter your full name.');
            const isEmailValid = validateField(emailInput, 'Please enter your email address.');
            const isMessageValid = validateField(messageInput, 'Please enter your message.');

            if (isEmailValid && !emailInput.value.includes('@')) {
                const formGroup = emailInput.parentElement;
                formGroup.classList.add('error');
                const errorDiv = document.createElement('span');
                errorDiv.className = 'error-message';
                errorDiv.innerText = 'Please enter a valid email.';
                formGroup.appendChild(errorDiv);
                isValid = false;
            } else if (!isNameValid || !isEmailValid || !isMessageValid) {
                isValid = false;
            }

            if (isValid) {
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

        const inputs = contactForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', function () {
                const formGroup = this.parentElement;
                if (formGroup.classList.contains('error')) {
                    formGroup.classList.remove('error');
                    const errorMsg = formGroup.querySelector('.error-message');
                    if (errorMsg) errorMsg.remove();
                }
            });
        });
    }
});