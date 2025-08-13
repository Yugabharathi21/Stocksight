-- Make the current user an admin
-- Replace 'your_email@example.com' with your actual email address

SELECT make_user_admin('yuga.bharathijai2106@gmail.com');

-- Verify the change
SELECT id, email, full_name, role, is_admin, created_at 
FROM users 
WHERE email = 'yuga.bharathijai2106@gmail.com';
