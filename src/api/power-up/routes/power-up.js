'use strict';

/**
 * power-up router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::power-up.power-up');
