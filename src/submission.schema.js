export const submissionSchema = {
    version: 0,
    type: "object",
    properties: {
      id: {
        type: 'string',
        primary: true,
      },
      vesselName: {
        type: 'string',
      },
      vesselImo: {
          type: 'string',
      },
      dateOffset: {
          type: 'object',
          properties: {
            date: {
                type: 'string'
            },
            offset: {
                type: 'number'
            }
          }
      },
      fuels: {
          type: 'object',
          properties: {
            LGO: {
                type: 'number'
            },
            IFO: {
                type: 'number'
            },
            MGO: {
                type: 'number'
            },
          }
      },
        totalFuel: {
            type: 'number'
        }
    }
}