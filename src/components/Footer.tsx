import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-deep-blue text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <p>&copy; 2023 Supply Chain Insights. Todos los derechos reservados.</p>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/privacidad" className="hover:text-vibrant-orange">Política de Privacidad</Link></li>
            <li><Link to="/terminos" className="hover:text-vibrant-orange">Términos de Servicio</Link></li>
            <li><Link to="/contacto" className="hover:text-vibrant-orange">Contacto</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}

export default Footer