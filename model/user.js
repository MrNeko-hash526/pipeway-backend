module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true
  });

  User.associate = function(models) {
    if (models && models.Dashboard && typeof User.hasMany === 'function') {
      // avoid duplicate alias registrations
      if (!User.associations || !User.associations.dashboards) {
        User.hasMany(models.Dashboard, { foreignKey: 'userId', as: 'dashboards' });
      }
    }
  };

  return User;
};