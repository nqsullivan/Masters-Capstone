import AuthService from '../services/auth';
import { expect, test, describe, beforeAll } from '@jest/globals';

describe('AuthService', () => {
  let testUser = { username: 'testUser', password: 'password123' };

  beforeAll(async () => {
    await AuthService.register(testUser.username, testUser.password);
  });

  test('should register a new user', async () => {
    const newUser = await AuthService.register('newUser', 'newPassword');
    expect(newUser).toHaveProperty('id');
    expect(newUser).toHaveProperty('username', 'newUser');
  });

  test('should not register a user with an existing username', async () => {
    try {
      await AuthService.register(testUser.username, 'newPassword');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Username already taken');
    }
  });

  test('should log in with correct credentials', async () => {
    const token = await AuthService.login(testUser.username, testUser.password);

    expect(token).toBeDefined();
  });

  test('should not log in with incorrect credentials', async () => {
    try {
      const token = await AuthService.login(testUser.username, 'wrongPassword');
      expect(token).toBeNull();
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid credentials');
    }
  });

  test('should verify a valid JWT token', async () => {
    const token = await AuthService.login(testUser.username, testUser.password);
    if (!token) {
      throw new Error('Token not generated');
    }

    const verifiedUser = AuthService.verifyToken(token);
    expect(verifiedUser).toBeDefined();
    expect(verifiedUser?.username).toBe(testUser.username);
  });

  test('should reject an invalid JWT token', () => {
    const verifiedUser = AuthService.verifyToken('invalidtoken');
    expect(verifiedUser).toBeNull();
  });
});
