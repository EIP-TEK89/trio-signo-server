<p align="center">
 <img src="assets/logo-crop.png" alt="Trio Signo Logo" width="300">
</p>

<h1 align="center">Trio Signo Backend</h1>

<p align="center">
  A robust API for the Trio Signo application, built with modern technologies
</p>

<p align="center">
  <a href="#about">About</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api">API</a> •
  <a href="#development">Development</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-%23336791.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

## 🚀 About <a name="about"></a>

Trio Signo Backend is the central server that powers the Trio Signo application, an educational platform dedicated to sign language learning. This RESTful API handles authentication, data storage, lessons, exercises, and more.

## 💻 Tech Stack <a name="tech-stack"></a>

- **[NestJS](https://nestjs.com/)** - Progressive framework for building efficient and scalable server-side applications
- **[Prisma](https://www.prisma.io/)** - Modern ORM for Node.js and TypeScript
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database management system
- **[TypeScript](https://www.typescriptlang.org/)** - Typed programming language based on JavaScript
- **JWT** - For secure authentication
- **OAuth2** - Support for authentication via Google

## 🏁 Getting Started <a name="getting-started"></a>

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/EIP-TEK89/trio-signo-fullstack.git
   cd trio-signo-fullstack/trio-signo-server
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Configure environment variables

   ```bash
   cp .env.example .env
   # Modify the variables in the .env file according to your configuration
   ```

4. Run Prisma migrations

   ```bash
   npx prisma migrate dev
   ```

5. Start the server
   ```bash
   npm run start:dev
   ```

## 📚 API <a name="api"></a>

### Documentation

Once the server is running, Swagger documentation is available at:

```
http://localhost:3000/api/docs
```

### Main Endpoints

- `/auth` - Authentication and user management
- `/dictionary` - Sign dictionary management
- `/lessons` - Access to lessons and educational content
- `/exercises` - Interaction with learning exercises

## 🛠️ Development <a name="development"></a>

### Useful Commands

```bash
# Development mode
npm run start:dev

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Linting
npm run lint

# Code formatting
npm run format
```

### Docker

The project can be run in Docker:

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up
```

## 🚢 Deployment <a name="deployment"></a>

### Production

To deploy in production:

```bash
npm run build
npm run start:prod
```

### CI/CD

The project uses GitHub Actions for continuous integration and deployment. See the `.github/workflows` folder for more details.

## 👥 Contributing <a name="contributing"></a>

Contributions are welcome! Please read the [contributing guidelines](https://github.com/EIP-TEK89/trio-signo-fullstack/blob/main/Contributing.md) before submitting a PR.

### Workflow

1. Fork the repository
2. Create a branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License <a name="license"></a>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 EIP-TEK89 Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Contact

For more information, please contact:

- [antoine.rospars@epitech.eu](mailto:antoine.rospars@epitech.eu)
- [yann.lebib@epitech.eu](mailto:yann.lebib@epitech.eu)

---

<p align="center">
  © 2025 Trio Signo - Developed by the EIP-TEK89 team
</p>
