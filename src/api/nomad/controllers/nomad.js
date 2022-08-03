'use strict';

/**
 *  nomad controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::nomad.nomad');
