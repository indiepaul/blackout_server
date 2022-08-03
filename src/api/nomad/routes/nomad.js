'use strict';

/**
 * nomad router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::nomad.nomad');
