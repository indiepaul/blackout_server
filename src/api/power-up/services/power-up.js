'use strict';

/**
 * power-up service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::power-up.power-up');
