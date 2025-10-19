module.exports = (sequelize, DataTypes) => {
  const Dashboard = sequelize.define('Dashboard', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'user_id',                    // explicit DB column
      references: { model: 'users', key: 'id' } // use actual table name
    },
    widgets: {
      // store widgets as JSON array: [{ type, title, settings, position:{x,y,w,h} }, ...]
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    layout: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default'
    },
    tags: {
      // JSON array of strings
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    }
  }, {
    tableName: 'dashboards',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_default'] }
    ]
  });

  Dashboard.associate = function(models) {
    const UserModel = (models && models.User) || (sequelize && sequelize.models && sequelize.models.User);
    if (!UserModel || typeof UserModel !== 'function') {
      console.warn('Dashboard.associate: User model not available yet — skipping association.');
      return;
    }

    Dashboard.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });
    // do not call UserModel.hasMany(...) here to avoid duplicate alias errors
  };

  return Dashboard;
};