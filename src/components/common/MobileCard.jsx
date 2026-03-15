import React from 'react';
import { MoreVertical, ChevronRight } from 'lucide-react';
import './MobileCard.css';

const MobileCard = ({ title, subtitle, details, badge, actions, onClick }) => {
    return (
        <div className="mobile-card" onClick={onClick}>
            <div className="mobile-card-header">
                <div className="mobile-card-main-info">
                    <h3 className="mobile-card-title">{title}</h3>
                    <p className="mobile-card-subtitle">{subtitle}</p>
                </div>
                {badge && <div className="mobile-card-badge">{badge}</div>}
            </div>
            
            <div className="mobile-card-body">
                {details && details.map((detail, index) => (
                    <div key={index} className="mobile-card-detail">
                        <span className="detail-label">{detail.label}:</span>
                        <span className="detail-value">{detail.value}</span>
                    </div>
                ))}
            </div>

            <div className="mobile-card-footer">
                <div className="mobile-card-actions">
                    {actions}
                </div>
                <ChevronRight size={18} className="mobile-card-arrow" />
            </div>
        </div>
    );
};

export default MobileCard;
