import { hashPassword } from '../../functions/hashPassword.function';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('hashPassword', () => {
  it('should hash a password', async () => {
    const password = 'password123';
    const hashedPassword = 'hashedPassword';

    (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

    const result = await hashPassword(password);
    expect(result).toEqual(hashedPassword);
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
  });
});
