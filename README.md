# Leon'art Back-end

[![Node.js](https://img.shields.io/badge/Node.js-v16.13.1-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.17.1-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This is the back-end for Leon'art, the startup that brings art to your doorstep, and that aims to democratize art selling. The back-end is built using Node.js and Express.js, and provides the API that the mobile app and web app use to interact with the database.

## Installation

To install the back-end, follow these steps:

1. Clone the repository to your local machine
2. Install the required dependencies by running `npm install`
3. Create a `.env` file in the root directory, following the `.env.example` file as a template
4. Start the server by running `npm start`

## Usage

Once the server is running, it provides the following API endpoints:

### Publication

- `POST /artworks`: Create a new artwork.
- `POST /artworks/{id}/steps`: Create a new step for an artwork.
- `POST /artworks/{id}/images`: Upload an image of the artwork purchased by the user.

### Vente

- `POST /artworks/{id}/sale`: Put an artwork on sale.
- `POST /commission`: Offer artist services for customized artwork.
- `PUT /artworks/{id}/offer`: Accept or reject an offer made by a client to purchase an artwork.

### Achat

- `POST /artworks/{id}/purchase`: Purchase an artwork.
- `PUT /artworks/{id}/offer`: Place an offer on an artwork.
- `POST /commissions`: Order customized artwork from an artist.

### Messagerie

- `POST /conversations`: Create a conversation with an artist.
- `GET /conversations/{id}/messages`: Get messages in a conversation.
- `POST /support`: Contact customer support.

### Exploration

- `GET /artworks`: Get a list of artworks for the home feed.
- `GET /artists/{id}`: Get information about an artist and their artworks.
- `GET /users/{id}`: Get information about a user and their liked artworks.
- `GET /users/{id}/feed`: Get a feed of artworks and artists liked by a user.
- `POST /users/{id}/collections`: Create a collection of liked artworks and artists.
- `POST /artworks/{id}/ar`: View an artwork in augmented reality.

### Recherche

- `GET /artworks?artist={artist_name}`: Search for artworks by artist name.
- `GET /artworks?title={title}`: Search for artworks by title.
- `GET /artworks?tags={tags}`: Search for artworks by tags.


All requests require a valid JWT token, which can be obtained by sending a login request to `/api/auth/login`.

## Contributing

If you would like to contribute to the development of the Leon'art back-end, please follow the guidelines outlined in [CONTRIBUTING.md](https://github.com/Leon-Art-EIP/.github/blob/main/CONTRIBUTING.md).

## Code of Conduct

We expect all contributors to adhere to our [code of conduct](https://github.com/Leon-Art-EIP/.github/blob/main/CODE_OF_CONDUCT.md).

## Documentation

To learn more about Node.js and Express.js, check out their official documentation:

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express.js Documentation](https://expressjs.com/en/4x/api.html)

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
