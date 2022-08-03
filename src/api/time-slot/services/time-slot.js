'use strict';

/**
 * time-slot service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::time-slot.time-slot');
