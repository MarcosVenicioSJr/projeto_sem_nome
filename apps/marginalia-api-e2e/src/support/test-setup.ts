import axios from 'axios';

module.exports = async function () {
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3000';
  axios.defaults.baseURL = `http://${host}:${port}`;
  // Assert on 4xx/5xx bodies instead of catching thrown errors.
  axios.defaults.validateStatus = () => true;
};
