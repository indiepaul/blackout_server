'use strict';

/**
 *  power-up controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::power-up.power-up');
