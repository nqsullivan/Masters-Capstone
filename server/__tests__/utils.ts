import AuthService from '../src/services/auth.js';

class TestUtils {
  async getValidToken(): Promise<string | null> {
    const testUser = { username: 'testUtils', password: 'password123' };
    await AuthService.register(testUser.username, testUser.password);
    return await AuthService.login(testUser.username, testUser.password);
  }
}

export default new TestUtils();
