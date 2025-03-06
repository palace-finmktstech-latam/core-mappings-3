// src/components/Navigation.jsx
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/palace_blanco.png';

function Navigation() {
  
  // Get current location to determine active link
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            src={logo}
            height="50"
            className="d-inline-block align-top me-2"
            alt="Company Logo"
          />
          
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/mapping" className={currentPath === "/mapping" ? "fw-bold border-bottom border-light" : ""}>Data Mapping</Nav.Link>
            <Nav.Link as={Link} to="/admin" className={currentPath === "/admin" ? "fw-bold border-bottom border-light" : ""}>Admin</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;