'use strict';

const { format } = require('date-fns')

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
   register({ strapi }) {
    const extension = ({ nexus }) => ({      
      types: [
        nexus.objectType({
          name: 'Contact',
          definition(t) {
            t.id('id')
            t.string('name')
            t.string('phone')
            t.field('location', {
              type: 'ContactLocation'
            })
            t.string('groupId')
            t.date('lastActive')
          },
        }),
        nexus.objectType({
          name: 'ContactLocation',
          definition(t) {
            t.id('id')
            t.string('name')
            t.string('district')
            t.string('region')
            t.string('groupId')
          },
        }),
        nexus.mutationType({
          definition(t) {
            t.field('requestPowerUp', {
              type: 'PowerUpEntityResponse',
              args: {
                data: nexus.inputObjectType({
                  name: 'PowerUpRequest',
                  definition(t) {
                    t.nonNull.id('nomad'),
                    t.nonNull.id('contact'),
                    t.nonNull.id('slot'),
                    t.nonNull.string('name'),
                    t.string('request_note')
                  },
                }),
              }
            })
          }
        }),
        nexus.queryType({
          definition(t) {
            t.field('nextBlackout', {
              type: 'SlotEntityResponse',
              args: {
                group: nexus.nonNull(nexus.idArg()),
              },
            }),
            t.field('contacts', {
              type: nexus.list('Contact'),
              args: {
                numbers: nexus.list('String'),
              },
            }),
            t.field('availableDays', {
              type: nexus.list('Date'),
            })
          },
        }),
      ],
      resolvers: {
        Mutation: {
          requestPowerUp: {
            async resolve( _,args ) {
              const value = await strapi.entityService
              .create('api::power-up.power-up', 
              {
                data: args.data,
                populate: {
                  nomad: true, 
                  slot: {
                    populate: { time_slot: true }
                  }
                },
              })
              const date = format(new Date(value.slot.date), 'do MMMM')
              const notif = await strapi.entityService
              .create('api::notification.notification', {
                data: {
                  type: "power-up",
                  nomad: args.data.contact,
                  message: `${args.data.name} is requesting Power Up on ${date} at ${value.slot.time_slot.start.substr(0,5)}`,
                  meta: `{ "id": "${value.id}" }`
                }
              })
              if(value == null) {
                return null;
              }
              return { value, info: { args: {}, resourceUID: 'api::power-up.power-up' } };
            }
          }
        },
        Query: {
          nextBlackout: {
            async resolve( _, args ) {
              const now = new Date()
              const longMonth = now.getMonth() < 9 ? '0' + (now.getMonth() + 1) : now.getMonth() + 1
              const longDay = now.getDate() < 10 ? '0' + now.getDate() : now.getDate()
              const hours = now.getHours() < 10 ? '0' + now.getHours() : now.getHours()
              const minutes = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()
              const time = hours + ':' + minutes + ':00:00'
              const date = now.getFullYear() + '-' + longMonth + '-' + longDay;
              const res = await strapi.entityService.findMany('api::slot.slot', {
                filters: {
                  $or: [
                    {
                      $and: [
                        { date: { $eq: date }},
                        { time_slot: { start: { $gt: time }}},
                        { state: {
                          status: false,
                          group: { id: args.group }
                        }}
                      ], 
                      $and: [
                        { date: { $gt: date }},
                        { state: {
                          status: false,
                          group: { id: args.group }
                        }}
                      ], 
                    }
                  ]
                },
                sort: { date: 'ASC', time_slot: { start: 'ASC'} },
                populate: { state: true },
              });
              const value = res.length > 0 ? res[0] : null;
              if(value == null) {
                return null;
              }
              return { value, info: { args: {}, resourceUID: 'api::slot.slot' } };
            },
          },
          contacts: {
            async resolve( _, args ) {
              const res = await strapi.entityService.findMany('api::nomad.nomad', {
                filters: {
                  phone: args.numbers,
                },
                populate: ['location.group','location.district.region']
              });
              return res.map((nomad) => {
                return {
                  id: nomad.id,
                  name: nomad.name,
                  phone: nomad.phone,
                  location: {
                    name: nomad.hideLocation ? null : nomad.location.name,
                    district: nomad.location.district.name,
                    region: nomad.location.district.region.name,
                    groupId: nomad.location.group.id,
                  },
                  lastActive: nomad.hideActivity ? null : format(new Date(nomad.lastActive), 'yyyy-MM-dd')
                }
              })
            },
          },
          availableDays: {
            async resolve( _, args ) {
              const now = new Date()
              const longMonth = now.getMonth() < 9 ? '0' + (now.getMonth() + 1) : now.getMonth() + 1
              const longDay = now.getDate() < 10 ? '0' + now.getDate() : now.getDate()
              const date = now.getFullYear() + '-' + longMonth + '-' + longDay;
              const res = await strapi.entityService.findMany('api::slot.slot', {
                filters: { date: { $gte: date }},
                sort: { date: 'ASC'},
              });
              return [...new Set(res.map((day) => day.date))];
            },
          },
        },
      }
    });

    strapi.plugin('graphql').service('extension').use(extension)
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) {},
};
