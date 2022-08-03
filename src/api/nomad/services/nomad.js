'use strict';

/**
 * nomad service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::nomad.nomad');
