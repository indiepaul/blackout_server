'use strict';

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
        nexus.queryType({
          definition(t) {
            t.field('nextBlackout', {
              type: 'SlotEntityResponse',
              args: {
                group: nexus.nonNull(nexus.idArg()),
              },
            }),
            t.field('availableDays', {
              type: nexus.list('Date'),
            })
          },
        }),
      ],
      resolvers: {
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
              return { value, info: { args: {}, resourceUID: value.id } };
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
