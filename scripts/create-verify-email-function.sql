-- Function to verify a user's email manually (admin use only)
CREATE OR REPLACE FUNCTION verify_user_email(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's email_confirmed_at timestamp
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE email = user_email
    AND email_confirmed_at IS NULL;
  
  IF FOUND THEN
    RETURN 'Email verified successfully';
  ELSE
    RETURN 'User not found or already verified';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users (admin check is done in API)
GRANT EXECUTE ON FUNCTION verify_user_email(TEXT) TO authenticated;
