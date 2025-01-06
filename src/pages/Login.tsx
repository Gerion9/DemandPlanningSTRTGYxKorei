import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const allowedUsers: { [key: string]: User } = {
    'ADMIN': {
      email: '',
      password: 'admin.korei'
    },
    'JULIA VALLEJO': {
      email: 'compras@grupocler.com.mx',
      password: 'julia.vallejo'
    },
    'DARINEL MORENO': {
      email: 'darinel.moreno@korei.com.mx',
      password: 'darinel.moreno'
    },
    'MANUEL FLORES': {
      email: 'analistadireccion@korei.com.mx',
      password: 'manuel.flores'
    },
    'CARLOS PROTILLA': {
      email: 'compras2@korei.com.mx',
      password: 'carlos.protilla'
    },
    'ROGER ENRIQUEZ': {
      email: 'roger.eqz@grupocler.com.mx',
      password: 'roger.enriquez'
    },
    'JOSE GABRIEL ESQUINCA': {
      email: 'direccionkorei@grupocler.com.mx',
      password: 'jose.esquinca'
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Buscar si el usuario existe y verificar sus credenciales
    const userEntry = Object.entries(allowedUsers).find(([name, user]) => {
      // Para el admin, solo verificamos el nombre y contraseña
      if (name === 'ADMIN') {
        return username === 'ADMIN' && password === user.password;
      }
      // Para otros usuarios, verificamos el email y contraseña
      return (username === user.email || username === name) && password === user.password;
    });

    if (userEntry) {
      // Autenticación exitosa
      localStorage.setItem('authToken', 'dummy_token');
      localStorage.setItem('userName', userEntry[0]); // Guardamos el nombre del usuario
      navigate('/');
    } else {
      setError('Nombre de usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pale-sky-blue py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <img
              className="h-12 w-auto"
              src="https://images.squarespace-cdn.com/content/v1/5f1b0ff6550a4d7d70797c8a/744eaa17-8b53-417a-ac21-74db71817e67/Fotos+para+arti%CC%81culos.png.PNG?format=1500w"
              alt="Logo 1"
            />
            <span className="mx-2 text-2xl font-bold text-dark-navy self-center">X</span>
            <img
              className="h-12 w-auto"
              src="https://www.korei.mx/imagenes/top_logo.png"
              alt="Logo 2"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-medium-blue">
            Iniciar sesión
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Nombre de usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-medium-blue focus:border-medium-blue focus:z-10 sm:text-sm"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-medium-blue focus:border-medium-blue focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-medium-blue hover:bg-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medium-blue"
            >
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;