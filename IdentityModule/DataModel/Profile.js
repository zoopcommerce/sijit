// This code generated by Sds\DoctrineExtensions\DojoModel

define ([
        'dojo/_base/declare',
        'dojo/Stateful'
    ],
    function (
        declare,
        Stateful
    ){
        // module:
        //		Sds/IdentityModule/DataModel/Profile

        var model = declare (
            'Sds/IdentityModule/DataModel/Profile',
            [Stateful],
            {
                // summary:
                //		A mirror of doctrine document Sds\IdentityModule\DataModel\Profile
                //
                // description:
                //      Use this to create documents in a browser which can the be passed to a doctrine server for
                //      persistence

                // _className: string
                //      The doctrine document class name. Don't change this one!
                _className: 'Sds\\IdentityModule\\DataModel\\Profile',

                toJSON: function(){
                    // summary:
                    //     Function to handle serialization

                    var json = {};
                    if (this.get('_className')) {
                        json['_className'] = this.get('_className');
                    }

                    return json;
                }
            }
        );

        model.metadata = {
            "fields": [

            ]
        };

        return model;
    }
);