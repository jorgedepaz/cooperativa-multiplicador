/**
 * Multiplicador · efectos del sitio.
 * - Encabezado compacto al hacer scroll.
 * - Entrada suave de secciones (clases "revelar" y "revelar-cascada").
 * - Cifras animadas (estilo de título "Cifra animada").
 * - Marca la página actual en el menú.
 * - Filtro de preguntas frecuentes (estilo de búsqueda "Filtro de preguntas").
 * Sin dependencias. Respeta "reducir movimiento" del sistema.
 */
( function () {
	'use strict';

	var doc = document;
	var raiz = doc.documentElement;
	var reducir = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	// Encabezado compacto.
	var alDesplazar = function () {
		raiz.classList.toggle( 'con-desplazamiento', window.scrollY > 24 );
	};
	window.addEventListener( 'scroll', alDesplazar, { passive: true } );
	alDesplazar();

	// Página actual en el menú.
	var ruta = window.location.pathname.replace( /index\.html$/, '' ).replace( /\/+$/, '/' );
	doc.querySelectorAll( '.menu-principal a.wp-block-navigation-item__content' ).forEach( function ( enlace ) {
		var destino = new URL( enlace.href, window.location.href ).pathname.replace( /index\.html$/, '' ).replace( /\/+$/, '/' );
		if ( destino !== '/' && ruta.slice( -destino.length ) === destino ) {
			enlace.classList.add( 'es-actual' );
			enlace.setAttribute( 'aria-current', 'page' );
			var padre = enlace.closest( '.wp-block-navigation__submenu-container' );
			if ( padre && padre.previousElementSibling ) {
				padre.parentElement.querySelector( ':scope > .wp-block-navigation-item__content' )?.classList.add( 'es-actual' );
			}
		}
	} );

	// Cifras animadas.
	var formato = new Intl.NumberFormat( 'es-GT' );
	var animarCifra = function ( el ) {
		var texto = el.textContent;
		var coincidencia = texto.match( /\d[\d,]*/ );
		if ( ! coincidencia || reducir ) {
			return;
		}
		var final = parseInt( coincidencia[ 0 ].replace( /,/g, '' ), 10 );
		var antes = texto.slice( 0, coincidencia.index );
		var despues = texto.slice( coincidencia.index + coincidencia[ 0 ].length );
		var conSeparador = coincidencia[ 0 ].indexOf( ',' ) > -1;
		var inicio = null;
		var duracion = 1600;
		var paso = function ( t ) {
			if ( ! inicio ) {
				inicio = t;
			}
			var avance = Math.min( 1, ( t - inicio ) / duracion );
			var suave = 1 - Math.pow( 1 - avance, 3 );
			var valor = Math.round( final * suave );
			el.textContent = antes + ( conSeparador ? formato.format( valor ) : String( valor ) ) + despues;
			if ( avance < 1 ) {
				window.requestAnimationFrame( paso );
			}
		};
		window.requestAnimationFrame( paso );
	};

	// Entradas al hacer scroll.
	var elementos = doc.querySelectorAll( '.revelar, .revelar-cascada, .is-style-cifra' );
	if ( 'IntersectionObserver' in window && ! reducir ) {
		var observador = new IntersectionObserver( function ( entradas ) {
			entradas.forEach( function ( entrada ) {
				if ( ! entrada.isIntersecting ) {
					return;
				}
				var el = entrada.target;
				el.classList.add( 'es-visible' );
				if ( el.classList.contains( 'is-style-cifra' ) ) {
					animarCifra( el );
				}
				observador.unobserve( el );
			} );
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 } );
		elementos.forEach( function ( el ) {
			observador.observe( el );
		} );
	} else {
		elementos.forEach( function ( el ) {
			el.classList.add( 'es-visible' );
		} );
	}

	// Filtro de preguntas frecuentes.
	doc.querySelectorAll( '.wp-block-search.is-style-filtro' ).forEach( function ( buscador ) {
		var campo = buscador.querySelector( 'input[type="search"]' );
		var formulario = buscador.closest( 'form' ) || buscador;
		var zona = buscador.closest( '.zona-preguntas' ) || doc;
		var preguntas = zona.querySelectorAll( '.wp-block-accordion-item' );
		var aviso = zona.querySelector( '.sin-resultados' );
		if ( ! campo || ! preguntas.length ) {
			return;
		}
		var normalizar = function ( s ) {
			return s.toLowerCase().normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' );
		};
		var filtrar = function () {
			var consulta = normalizar( campo.value.trim() );
			var visibles = 0;
			preguntas.forEach( function ( item ) {
				var coincide = ! consulta || normalizar( item.textContent ).indexOf( consulta ) > -1;
				item.hidden = ! coincide;
				visibles += coincide ? 1 : 0;
			} );
			zona.querySelectorAll( '.grupo-preguntas' ).forEach( function ( grupo ) {
				grupo.hidden = ! grupo.querySelector( '.wp-block-accordion-item:not([hidden])' );
			} );
			if ( aviso ) {
				aviso.hidden = visibles > 0;
			}
		};
		campo.addEventListener( 'input', filtrar );
		formulario.addEventListener( 'submit', function ( evento ) {
			evento.preventDefault();
			filtrar();
		} );
	} );
}() );
